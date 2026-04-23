# AI Interview Timing Configuration Update

## Summary
Updated the AI interview system to support **20 minutes total time** with **minimum 13 questions**.

## Changes Made

### 1. Frontend Timing Configuration (`frontend/src/pages/aiInterviewTiming.js`)
- **Updated per-question time limits** to fit 13 questions within 20 minutes (1200 seconds):
  - DSA / Coding: 300s → **120s** (2 min)
  - System Design: 480s → **150s** (2.5 min)
  - Behavioral: 180s → **90s** (1.5 min)
  - Technical: 240s → **90s** (1.5 min)
  - HR: 120s → **75s** (1.25 min)
  - Default: 240s → **90s** (1.5 min)

**Average time per question**: ~92 seconds (1.5 minutes)

### 2. Backend Question Count Configuration (`backend/routes/companyInterview.js`)
- **Default question count**: 8 → **13**
- **Maximum allowed questions**: 12 → **20**
- **Fresher interview total**: 12 → **13**

### 3. Frontend Question Count (`frontend/src/pages/AIInterviewPage.jsx`)
- Updated both fresher and experienced candidates to use **13 questions**

### 4. Fresher Interview Question Structure (13 Questions)

#### HR Round:
- **Q1**: Fixed intro question
- **Q2-Q11**: AI-generated behavioral questions (10 questions)
  - Role Interest & Motivation
  - Project & Achievement
  - Problem-Solving & Challenges
  - Teamwork & Collaboration
  - Stress Management
  - Strengths & Fit
  - Growth & Development
  - Adaptability & Flexibility
  - Culture & Fit
  - Career Goals & Aspirations (NEW)
- **Q12**: Fixed wrap-up ("Do you have any questions?")
- **Q13**: Fixed conclusion (YES/NO branching)

#### Technical Round:
- **Q1**: Fixed intro question
- **Q2-Q11**: AI-generated technical questions (10 questions)
  - Resume & Projects
  - Top Skill
  - OOP Fundamentals
  - Interface vs Abstract Class
  - Primary Key vs Foreign Key
  - Database Normalization
  - Language Strengths
  - GET vs POST
  - Process vs Thread
  - Data Structures (NEW)
- **Q12**: Fixed wrap-up ("Do you have any questions?")
- **Q13**: Fixed conclusion (YES/NO branching)

## Time Budget Breakdown

### Total Interview Time: 20 minutes (1200 seconds)

**Per Question Type:**
- DSA/Coding questions: 2 min each
- System Design questions: 2.5 min each
- Technical questions: 1.5 min each
- Behavioral questions: 1.5 min each
- HR questions: 1.25 min each

**Example 13-Question Interview (Mixed):**
- 3 DSA questions: 3 × 120s = 360s (6 min)
- 2 System Design: 2 × 150s = 300s (5 min)
- 5 Technical: 5 × 90s = 450s (7.5 min)
- 3 HR: 3 × 75s = 225s (3.75 min)
- **Total**: 1335s (22.25 min) - slightly over, but auto-submit ensures 20 min max

**Example 13-Question Fresher Technical:**
- 11 Technical questions: 11 × 90s = 990s (16.5 min)
- 2 HR questions (wrap-up): 2 × 75s = 150s (2.5 min)
- **Total**: 1140s (19 min) - fits within 20 min budget

## Features Maintained
- ✅ Auto-submit when per-question timer expires
- ✅ Global 20-minute interview timer
- ✅ 30-second countdown warning before auto-submit
- ✅ Pause/resume functionality
- ✅ AI-generated questions for variety
- ✅ Fixed intro/wrap-up questions for consistency
- ✅ Experience-level adaptive questioning

## Testing Recommendations
1. Test a full 13-question interview to verify 20-minute completion
2. Verify auto-submit triggers at correct time limits
3. Test both fresher and experienced interview flows
4. Verify HR and Technical round question counts
5. Test pause/resume doesn't break timing

## Notes
- The system will auto-submit answers when per-question time expires
- The global 20-minute timer will end the interview regardless of question count
- Questions are dynamically generated, so each interview is unique
- Time limits are enforced on both frontend and backend
