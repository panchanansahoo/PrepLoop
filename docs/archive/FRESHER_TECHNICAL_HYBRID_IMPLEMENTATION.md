# Fresher Technical Hybrid Interview Implementation

## Overview
Modified `backend/routes/companyInterview.js` to implement a **hybrid 12-question fresher technical interview flow** where:
- **Q1** (Intro): Fixed scripted question
- **Q2-Q10** (Technical Topics): AI-generated follow-ups with specific topic prompts
- **Q11** (Wrap-up): Fixed scripted question
- **Q12** (Conclusion): Fixed scripted closing message
- **20-minute countdown**: Unchanged
- **Final "No"**: Auto-closes with compliment message

## Fixed Questions (Q1, Q11, Q12)

### Q1 - Introduction (Fixed)
```
"Good afternoon, my name is Abhishek Sen, I work as a technical lead with Preploop, 
and I'll be conducting your technical discussion today. We'll cover fundamentals in 
databases, OOP, and web concepts. To begin with, could you introduce yourself and walk 
me through your background, including your technical interests?"
```

### Q11 - Wrap-Up (Fixed)
```
"Do you have any questions for me about the role, the team, or our company?"
```

### Q12 - Conclusion (Fixed)
**If candidate had questions (Q11 → "Yes"):**
```
"Thank you for your thoughtful questions! We really appreciate your interest. 
We'll review our discussion and get back to you soon with next steps."
```

**If no questions (Q11 → "No"):**
```
"Thank you so much for your time today! You've given some really thoughtful technical 
answers. We'll review our discussion and be in touch soon. Best of luck!"
```

---

## AI-Generated Topics (Q2-Q10)

Each question is generated dynamically by Groq LLM with a specific topic prompt:

| Q# | Topic | AI Prompt |
|----|-------|-----------|
| Q2 | Resume & Projects | "Ask the candidate to elaborate on a specific project from their resume. Focus on their role, the tech stack used, and what they learned." |
| Q3 | Top Skill | "Ask about the programming language or framework they're most confident in, and explain a concept they recently learned or used." |
| Q4 | OOP Fundamentals | "Explain one or two foundational OOP concepts (encapsulation, inheritance, polymorphism, abstraction) with a real-world example." |
| Q5 | Interface vs Abstract Class | "Compare interfaces and abstract classes: differences? When to use each? Keep clear and focused." |
| Q6 | Primary Key vs Foreign Key | "Explain the difference between primary keys and foreign keys. Give a simple table example." |
| Q7 | Database Normalization | "What is database normalization and why matters? Describe 1NF, 2NF, 3NF." |
| Q8 | Language Strengths | "Explain a core concept or strength of their preferred language (memory management, type system, async model)." |
| Q9 | GET vs POST | "Explain differences between HTTP GET and POST. When to use each? Security implications?" |
| Q10 | Process vs Thread | "Compare processes and threads: key differences? When to use one over the other?" |

---

## Implementation Details

### New Data Structures

#### `FRESHER_TECHNICAL_FIXED`
```javascript
const FRESHER_TECHNICAL_FIXED = {
  Q1: 'Good afternoon, my name is Abhishek Sen, ...',
  Q11: 'Do you have any questions for me...',
  Q12_YES: 'Thank you for your thoughtful questions...',
  Q12_NO: 'Thank you so much for your time today...',
};
```

#### `FRESHER_TECHNICAL_TOPICS`
```javascript
const FRESHER_TECHNICAL_TOPICS = {
  2: { topic: 'Resume & Projects', prompt: '...' },
  3: { topic: 'Top Skill', prompt: '...' },
  // ... Q4-Q10 ...
};
```

### New Helper Functions

#### `getFresherTechnicalQuestion(qNum)`
Returns fixed questions for Q1 and Q11; returns `null` for Q2-Q10 and Q12.

#### `getFresherTechnicalAIPrompt(qNum)`
Returns the topic data (topic name + AI prompt template) for Q2-Q10.

#### `generateFresherTechnicalQuestion(qNum, resumeContext)`
**Async function** that calls Groq LLM to generate a dynamic question for Q2-Q10 based on:
- Topic from `FRESHER_TECHNICAL_TOPICS[qNum]`
- Resume context (if available) for personalization
- Temperature: 0.7 (balanced creativity)
- Max tokens: 150 (concise question)
- Model: `llama-3.1-8b-instant`

Includes fallback behavior if AI generation fails.

### Flow Logic

#### `/start` Endpoint (POST)
When `fresherScriptMode === 'fresher-hr-tech'` AND `stage === 'Technical'`:
1. Detects hybrid fresher-technical mode (`isFresherTechnical = true`)
2. Returns Q1 (fixed intro) as opening question
3. Tags response with `questionSource: 'fresher-technical-hybrid'`
4. Includes proper metadata: `track: 'fresher-technical'`, `sequence: 1`

#### `/follow-up` Endpoint (POST)
When `isFresherTechnical === true`:
1. **Q1** → Already delivered; handles follow-up responses
2. **Q2-Q10** → Generates next AI-based question via `generateFresherTechnicalQuestion()`
   - If generation fails, provides fallback: `"Let's move on to the next topic: {topic}..."`
3. **Q11** → Returns fixed wrap-up question
4. **Q12** → Returns fixed closing based on candidate response to Q11
5. **Completion** → After Q12, sets `complete: true` and returns closing remark

**Response Structure:**
```javascript
{
  feedback: "Great response!",  // Random encouraging message
  followUpQuestion: "...",      // Next Q (empty if complete)
  closingRemark: "...",         // Final message (if Q12)
  complete: boolean,             // true if Q12 answered
  score: 72-90,                  // Random range
  strengths: "...",              // Single strength
  improvements: "...",           // Single improvement area
  questionSource: "fresher-technical-hybrid",
  questionMeta: { 
    id: "fresher-technical-q-{qNum}",
    track: "fresher-technical",
    sequence: qNum 
  }
}
```

---

## Verification Checklist

✅ **Backend Syntax**: No errors in companyInterview.js
✅ **Frontend Build**: Passes (3745 modules transformed)
✅ **Question Structure**: Q1 fixed, Q2-Q10 AI-generated, Q11-Q12 fixed
✅ **Total Questions**: 12 (unchanged)
✅ **Interview Mode**: `fresher-hr-tech` with `stage: 'Technical'`
✅ **Closing Logic**: Q12 auto-closes based on Q11 response
✅ **Countdown**: 20-minute timer (backed by frontend, unchanged)
✅ **AI Fallback**: If Groq fails, uses topic-based fallback text

---

## Testing Recommendations

### Manual Test Flow
1. Start interview → Verify Q1 (intro) appears
2. Submit answer → Verify Q2 is AI-generated on resume/projects
3. Submit Q2-Q10 answers → Each should be AI-generated on specific topics
4. Submit Q11 answer → Verify Q11 (wrap-up) appears
5. Say "No" to Q11 → Verify Q12 closes with "No questions" message
6. Say "Yes" to Q11 → Verify Q12 closes with "Thank you for questions" message

### Edge Cases
- **AI Generation Failure**: Should fall back to fallback text (verified in code)
- **Resume Context**: If available, passed to AI for personalization
- **Question Numbering**: Each Q2-Q10 should map to correct topic
- **Completion Flag**: Set to `true` only after Q12

---

## Code Changes Summary

**File Modified**: `backend/routes/companyInterview.js`

**Three Main Changes**:
1. **Added Fixed Questions & Topic Prompts** (lines 248-278)
   - `FRESHER_TECHNICAL_FIXED`: Q1, Q11, Q12 questions
   - `FRESHER_TECHNICAL_TOPICS`: Topic templates for Q2-Q10

2. **Added Helper Functions** (lines 280-327)
   - `getFresherTechnicalQuestion()`: Fetch fixed Q1, Q11
   - `getFresherTechnicalAIPrompt()`: Get topic template
   - `generateFresherTechnicalQuestion()`: **Async AI generation** for Q2-Q10

3. **Modified `/start` Handler** (lines 775-811)
   - Added `isFresherTechnical` check
   - Returns Q1 for fresher-technical mode
   - Tags response as `fresher-technical-hybrid`

4. **Modified `/follow-up` Handler** (lines 1117-1180)
   - Added `isFresherTechnical` check
   - Handles Q1-Q12 logic:
     - Q2-Q10: Generate AI questions
     - Q11: Return fixed wrap-up
     - Q12: Return fixed closing (based on Q11 response)
   - Completes interview after Q12

---

## Notes

- **AI Latency**: Each Q2-Q10 calls Groq; expect ~1-2 second per question
- **Personalization**: Resume context passed to AI for smarter questions
- **Consistency**: Random feedback and scores maintain interview feel without repetition
- **Metrics**: Each response tagged with `questionSource` for analytics
- **No Changes to**: HR Round mode, other interview types, 20-min countdown, frontend UI

