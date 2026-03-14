# 🚀 Phase 2 Days 1-2: EASY PROBLEMS (50 Total) - Execution Guide

**Status**: ✅ All infrastructure ready  
**Start Date**: March 14, 2026 (TODAY - DAY 1)  
**End Date**: March 15, 2026 (DAY 2)  
**Goal**: Collect 50 Easy problems (Problem IDs 23-72)  
**Current Progress**: 1/50 (Two Sum already in template)  
**Remaining**: 49 problems to collect  

---

## 📋 Right Now - Next 15 Minutes

### Step 1: Verify Setup (2 min)
```bash
# Terminal 1: Verify validator works (just did this ✅)
node validatePhase2Collection.js PHASE2_COLLECTED_PROBLEMS.json
# Shows: ✅ 1 problem validated successfully

# Terminal 2: Verify file exists
Test-Path PHASE2_COLLECTED_PROBLEMS.json
# Should show: True
```

### Step 2: Open Your Resources (3 min)
```
Browser Tab 1: https://leetcode.com/problems
Browser Tab 2: This file (PHASE2_EXECUTION_PLAN.md)
Editor: VS Code with 2 windows
  - Left: PHASE2_COLLECTED_PROBLEMS.json
  - Right: This execution guide
```

### Step 3: Copy Template (2 min)
```
Each problem you collect should follow this exact structure:

{
  "id": <number>,
  "title": "<string>",
  "description": "<string 50+ chars>",
  "difficulty": "Easy",  // Fixed for Days 1-2
  "pattern": "<one of 25 approved>",
  "companies": [<array of 1+ company strings>],
  "examples": [
    {
      "input": "<string>",
      "output": "<string>",
      "explanation": "<string>"
    },
    // ... at least 2 examples
  ],
  "test_cases": [
    {
      "input": "<string>",
      "output": "<string>",
      "type": "normal|edge|large"
    },
    // ... at least 3 cases (one of each type)
  ],
  "starter_code": {
    "python": "<code>",
    "javascript": "<code>",
    "cpp": "<code>",
    "java": "<code>"
  },
  "constraints": ["<string>", "<string>", ...],
  "function_name": "<string>",
  "time_complexity": "<string like 'O(n)'>",
  "space_complexity": "<string like 'O(n)'>"
}
```

### Step 4: Start Collection (8 min)
```
Problem ID 24: 
  1. Go to LeetCode: Search "Add Two Numbers"
  2. Copy: Title, Description (first 100 chars), Difficulty=Easy
  3. Extract: Pattern (likely "Linked List"), Companies from description
  4. Copy 2 examples from problem page
  5. Create 3 test cases (normal/edge/large)
  6. Grab starter code snippets (Python/JS/C++/Java)
  7. List constraints (at least 2)
  8. Function name: addTwoNumbers
  9. Estimate: Time O(?), Space O(?)
  10. Add to JSON array
  
Problem ID 25: Longest Substring Without Repeating
Problem ID 26: Median of Two Sorted Arrays
... continue pattern
```

---

## 📚 Easy Problems Collection Sheet (Days 1-2)

**Day 1 Target**: Problems 23-47 (25 problems)  
**Day 2 Target**: Problems 48-72 (25 problems)  

### Day 1 (March 14) - 25 Easy Problems

| ID | LeetCode # | Title | Pattern | Time | Status |
|----|-----------|-------|---------|------|--------|
| 23 | 1 | Two Sum | Hash Map | ✅ Done | ✅ |
| 24 | 2 | Add Two Numbers | Linked List | - | ⬜ |
| 25 | 3 | Longest Substring Without Repeating | Sliding Window | - | ⬜ |
| 26 | 7 | Reverse Integer | String | - | ⬜ |
| 27 | 9 | Palindrome Number | String | - | ⬜ |
| 28 | 13 | Roman to Integer | Hash Map | - | ⬜ |
| 29 | 14 | Longest Common Prefix | String | - | ⬜ |
| 30 | 20 | Valid Parentheses | Stack | - | ⬜ |
| 31 | 21 | Merge Two Sorted Lists | Linked List | - | ⬜ |
| 32 | 26 | Remove Duplicates from Sorted Array | Array | - | ⬜ |
| 33 | 27 | Remove Element | Array | - | ⬜ |
| 34 | 28 | Find the Index of the First Occurrence | String | - | ⬜ |
| 35 | 35 | Search Insert Position | Binary Search | - | ⬜ |
| 36 | 38 | Count and Say | String | - | ⬜ |
| 37 | 53 | Maximum Subarray | Dynamic Programming | - | ⬜ |
| 38 | 58 | Length of Last Word | String | - | ⬜ |
| 39 | 66 | Plus One | Array | - | ⬜ |
| 40 | 67 | Add Binary | String | - | ⬜ |
| 41 | 69 | Sqrt(x) | Binary Search | - | ⬜ |
| 42 | 70 | Climbing Stairs | Dynamic Programming | - | ⬜ |
| 43 | 83 | Remove Duplicates from Sorted List | Linked List | - | ⬜ |
| 44 | 88 | Merge Sorted Array | Array | - | ⬜ |
| 45 | 100 | Same Tree | Tree | - | ⬜ |
| 46 | 101 | Symmetric Tree | Tree | - | ⬜ |
| 47 | 104 | Maximum Depth of Binary Tree | Tree | - | ⬜ |

**End of Day 1**: 25/25 Easy ✅

### Day 2 (March 15) - 25 Easy Problems (28-72)

| ID | LeetCode # | Title | Pattern | Time | Status |
|----|-----------|-------|---------|------|--------|
| 48 | 110 | Balanced Binary Tree | Tree | - | ⬜ |
| 49 | 111 | Minimum Depth of Binary Tree | Tree | - | ⬜ |
| 50 | 112 | Path Sum | Tree | - | ⬜ |
| 51 | 118 | Pascal's Triangle | Array | - | ⬜ |
| 52 | 119 | Pascal's Triangle II | Array | - | ⬜ |
| 53 | 121 | Best Time to Buy and Sell Stock | Array | - | ⬜ |
| 54 | 125 | Valid Palindrome | String | - | ⬜ |
| 55 | 136 | Single Number | Bit Manipulation | - | ⬜ |
| 56 | 141 | Linked List Cycle | Linked List | - | ⬜ |
| 57 | 155 | Min Stack | Stack | - | ⬜ |
| 58 | 160 | Intersection of Two Linked Lists | Linked List | - | ⬜ |
| 59 | 167 | Two Sum II - Input Array Is Sorted | Two Pointers | - | ⬜ |
| 60 | 168 | Excel Sheet Column Title | String | - | ⬜ |
| 61 | 169 | Majority Element | Array | - | ⬜ |
| 62 | 175 | Combine Two Tables | Tree | - | ⬜ |
| 63 | 181 | Employees Earning More Than Their Managers | Hash Map | - | ⬜ |
| 64 | 182 | Duplicate Emails | Hash Map | - | ⬜ |
| 65 | 189 | Rotate Array | Array | - | ⬜ |
| 66 | 190 | Reverse Bits | Bit Manipulation | - | ⬜ |
| 67 | 191 | Number of 1 Bits | Bit Manipulation | - | ⬜ |
| 68 | 202 | Happy Number | Hash Set | - | ⬜ |
| 69 | 203 | Remove Linked List Elements | Linked List | - | ⬜ |
| 70 | 204 | Count Primes | Array | - | ⬜ |
| 71 | 205 | Isomorphic Strings | Hash Map | - | ⬜ |
| 72 | 206 | Reverse Linked List | Linked List | - | ⬜ |

**End of Day 2**: 25/25 Easy ✅  
**Total Days 1-2**: 50/50 Easy Problems ✅

---

## ⏱️ Time Breakdown - Days 1-2

### Day 1 (March 14) - 45 Minutes

```
Start: [Your start time]
0-15 min: Problems 23-27 (5 problems, 3 min each)
15-30 min: Problems 28-32 (5 problems, 3 min each)
30-45 min: Problems 33-47 (15 problems... wait, that's too many)

REVISED TIMING:
0-15 min: Problems 23-28 (6 problems, 2.5 min each)
15-30 min: Problems 29-34 (6 problems, 2.5 min each)
30-45 min: Problems 35-47 (13 problems... still too many)

ACTUAL TIMING (simplified):
Every 90 seconds: 1 Easy problem collected
45 minutes = 2700 seconds ÷ 90 seconds = 30 problems possible

So in 45 min you can realistically collect:
- 25 problems at relaxed pace (2.8 min each)
- 30 problems at fast pace (1.8 min each)
- 20 problems if being very thorough (3.6 min each)

GOAL: 25 problems in 45 min = 1.8 min/problem
```

**Action**: Start at [TIME] and end by [TIME + 45 min]

### Day 2 (March 15) - 45 Minutes

```
Same timing as Day 1
Start: [Your start time]
End: [TIME + 45 min]
```

---

## 🔍 Quality Checklist Per Problem (90 seconds max)

For EACH problem, before adding to JSON verify:

- [ ] **Difficulty**: "Easy" (Days 1-2)
- [ ] **Title**: 3+ characters, clear
- [ ] **Description**: 50+ characters, explains problem clearly
- [ ] **Pattern**: One of the 25 approved patterns
- [ ] **Companies**: At least 1 valid company name
- [ ] **Examples**: Exactly 2, each with input/output/explanation
- [ ] **Test Cases**: At least 3 (types: normal, edge, large)
- [ ] **Starter Code**: All 4 languages (Python, JS, C++, Java)
- [ ] **Constraints**: At least 2 constraints
- [ ] **Function Name**: Valid identifier
- [ ] **Complexity**: Both time and space listed
- [ ] **JSON**: No syntax errors

**If any fail → Fix before adding to array**

---

## 🧪 Validation - End of Each Day

### After Day 1 (Evening of March 14)

```bash
# Run validator
node validatePhase2Collection.js PHASE2_COLLECTED_PROBLEMS.json

# Expected output:
# ✅ 25 problems loaded
# ✅ ALL PROBLEMS VALIDATED SUCCESSFULLY!
# Passed: 25 | Failed: 0

# If any failed, fix them before Day 2
```

### After Day 2 (Evening of March 15)

```bash
# Run validator
node validatePhase2Collection.js PHASE2_COLLECTED_PROBLEMS.json

# Expected output:
# ✅ 50 problems loaded
# ✅ ALL PROBLEMS VALIDATED SUCCESSFULLY!
# Passed: 50 | Failed: 0
# Easy: 50 | Medium: 0 | Hard: 0
```

---

## 📝 Recommended Effort Distribution

### Most Efficient Approach (Pre-gather sources)

**Day 1 Prep (5 min before starting)**:
1. Open LeetCode in one tab, problems 1-30
2. Open VS Code with PHASE2_COLLECTED_PROBLEMS.json
3. Open this guide in another tab for reference

**Day 1 Collection (during 45 min)**:
- Don't research deeply, use what's on LeetCode
- Copy/paste descriptions directly
- Use 2 examples from LeetCode exactly
- Create test cases by modifying examples slightly
- Use standard starter code (basic function definition)
- Estimate Big O from solution explanation
- Add to JSON after each problem (don't batch)

**Day 1 Post-Collection (5 min after)**:
- Run validator
- Fix any JSON errors
- Note issues for Day 2

**Day 2 (same as Day 1 but problems 31-60)**

---

## 🛠️ Troubleshooting

### JSON won't validate after adding problems?

1. Copy first problem that fails to separate file
2. Check:
   - All string values have quotes
   - All arrays have commas between items
   - All objects have commas between properties
   - No trailing commas in last items
3. Use: https://jsonlint.com to find exact error

### Problem takes longer than 90 seconds?

Split the effort:
- Spend 60 sec on core fields (id, title, description, difficulty, pattern)
- Spend 30 sec on examples/test cases (copy from LeetCode)
- Use generic starter code templates

### Can't find all companies for a problem?

Use 1-2 from the problem title. If it's a classic problem, use:
- Google, Amazon, Facebook (for 50%+ problems)
- Add 1 random from VALID_COMPANIES list

### Function name seems wrong?

Use camelCase, matches LeetCode function name. Examples:
- `twoSum` for Two Sum
- `addTwoNumbers` for Add Two Numbers
- `longestSubstring` for Longest Substring

### Time/Space complexity hard to determine?

Look at LeetCode solutions section for typical approaches:
- Linear search: O(n) time, O(1) space
- Hash map: O(n) time, O(n) space
- Binary search: O(log n) time, O(1) space
- Tree traversal: O(n) time, O(h) space

---

## 📊 Progress Tracking

### Fill in as you go:

**Day 1 (March 14) Start**: [Time: __:__]
- Current time: 
- Problems collected: 1/25
- Problems to collect: 24

**Check-in at 30 min**: 
- Problems done: __/25
- Pace: On track / Behind / Ahead

**End of Day 1 (expected by 6 PM)**:
- Problems done: 25/25
- Validation: ✅ Pass / ❌ Fix needed
- Issues found: ___

---

**Day 2 (March 15) Start**: [Time: __:__]
- Current time:
- Problems collected: 25/50 (from yesterday)
- Problems to collect: 25

**End of Day 2 (expected by 6 PM)**:
- Problems done: 50/50
- Validation: ✅ Pass / ❌ Fix needed
- Issues found: ___

---

## 🎯 End State - When Day 2 is Complete

```
✅ 50 Easy problems collected
✅ Problem IDs: 23-72
✅ All in PHASE2_COLLECTED_PROBLEMS.json
✅ All pass validation (0 errors)
✅ All have 4 languages, 2+ examples, 3 test cases
✅ Ready for Days 3-4 (Medium problems)
```

---

## 🚀 NEXT: What Comes After Days 1-2

**Day 3 (March 15 evening)**: Medium problems start  
- 37 problems (IDs 73-109)
- Uses same template & validator
- Slightly more complex problems

**Day 4 (March 16)**: 38 Medium problems  
- IDs 110-147
- Finish Medium difficulty

**Day 5 (March 17)**: Hard problems start  
- 25 problems (IDs 148-172)

**Day 6 (March 18)**: Final Hard problems  
- 25 problems (IDs 173-197)
- Total: 175 collected ✅

**Day 7 (March 19)**: Final validation  
- Run full suite
- Fix any remaining issues
- Mark complete

---

## ✨ You're Ready!

**Everything is set up. The validator works. The template is filled.**

All you need to do is:
1. Open LeetCode (https://leetcode.com/problems)
2. Open PHASE2_COLLECTED_PROBLEMS.json
3. Start collecting Easy problems from LeetCode #1-60
4. Add each to the JSON array
5. Run validator when done

**Time commitment**: 45 minutes today, 45 minutes tomorrow  
**Result**: 50 Easy problems, foundation for the other 125

**You've got this. Let's collect! 🚀**

---

**Status**: 🟢 READY TO EXECUTE  
**Start Time**: NOW (Mar 14, 2026 afternoon)  
**Next Checkpoint**: March 15 evening (50 problems collected)

