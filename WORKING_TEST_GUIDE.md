# ✅ Fresher Interview - Working Test Guide

## 🚀 Quick Test (Easiest Way)

### Step 1: Start the Test Server
```bash
cd backend
node test-fresher-server.js
```

You should see:
```
🧪 Test server running on http://localhost:5001
```

### Step 2: Test with curl (Copy-paste these commands)

**A. Start Interview:**
```bash
curl -X POST http://localhost:5001/api/fresher-interview/start -H "Content-Type: application/json" -d "{\"interviewerName\":\"John Smith\",\"role\":\"Senior HR\",\"company\":\"TechCorp\",\"roundName\":\"Technical Round\"}"
```

Expected response:
```json
{
  "sessionId": "test-user-123-1234567890",
  "greeting": "Good afternoon, my name is \"John Smith\"...",
  "firstQuestion": "To begin with, could you introduce yourself...",
  "phase": "intro",
  "questionNumber": 1,
  "totalQuestions": 5
}
```

**B. Copy the sessionId from response, then submit answer:**
```bash
curl -X POST http://localhost:5001/api/fresher-interview/answer -H "Content-Type: application/json" -d "{\"sessionId\":\"PASTE_SESSION_ID_HERE\",\"answer\":\"I am a computer science student with experience in Java and Python\"}"
```

Expected response:
```json
{
  "nextQuestion": "Can you tell me about a project...",
  "phase": "intro",
  "questionNumber": 2,
  "totalQuestions": 5
}
```

**C. Continue answering (repeat 4 more times for intro phase)**

---

## 🌐 Test with Browser

### Step 1: Open the HTML test page
1. Open `test-fresher-interview.html` in your browser
2. Change API URL to: `http://localhost:5001`
3. Leave token field empty (test server doesn't need auth)
4. Fill in interviewer details
5. Click "Start Interview"

### Step 2: Submit answers
1. Copy the sessionId from the response
2. Type your answer in the textarea
3. Click "Submit Answer"
4. Repeat to go through all phases

---

## 📝 Complete Flow Example

Here's what happens in order:

### Phase 1: Intro (5 Fixed Questions)
1. "To begin with, could you introduce yourself and walk me through your background?"
2. "Can you tell me about a project or achievement that you're most proud of, and why?"
3. "Describe a time when you faced a difficult problem or challenge. How did you handle it?"
4. "What programming languages do you know/use regularly?"
5. "Have you used object-oriented design in a project?"

After Q5 → Automatically moves to HR phase

### Phase 2: HR (Random Questions)
- Gets random questions from pool of 17 HR questions
- Examples: "What attracted you to this role?", "Tell me about your strengths", etc.
- After ~5 questions → Moves to Technical phase

### Phase 3: Technical Fixed (5 Questions)
1. "Can you explain the main OOP concepts..."
2. "What is the difference between an array and a linked list..."
3. "What is the difference between a stack and a queue..."
4. "What are the different types of loops..."
5. "Can you write or dry run a simple program to reverse a string..."

After Q5 → Moves to Random Technical

### Phase 4: Technical Random (3 Questions minimum)
- Must include: 1 DSA + 2 OOP questions
- After completing → Interview ends with summary

---

## 🔧 Troubleshooting

### "Cannot connect" or "Network error"
✅ **Solution:** Make sure test server is running on port 5001
```bash
cd backend
node test-fresher-server.js
```

### "Session not found"
✅ **Solution:** Copy the exact sessionId from the start response
- Session format: `test-user-123-1234567890`
- Don't restart server between requests (sessions are in memory)

### Want to use main backend (port 5000)?
✅ **Solution:** You need authentication
1. Start main backend: `npm run dev`
2. Register/login to get JWT token
3. Use token in Authorization header or HTML form

---

## 📊 Expected API Responses

### Start Response
```json
{
  "sessionId": "test-user-123-1713456789",
  "greeting": "Good afternoon, my name is \"John Smith\", I work as an \"Senior HR\", and I'll be conducting your \"Technical Round\" discussion today. We'll mainly talk about your background, your interests, and see how you fit with our organisation.",
  "firstQuestion": "To begin with, could you introduce yourself and walk me through your background?",
  "phase": "intro",
  "questionNumber": 1,
  "totalQuestions": 5
}
```

### Answer Response (Next Question)
```json
{
  "nextQuestion": "Can you tell me about a project or achievement that you're most proud of, and why?",
  "phase": "intro",
  "questionNumber": 2,
  "totalQuestions": 5
}
```

### Answer Response (Phase Change)
```json
{
  "nextQuestion": "What attracted you to this role and to our company in particular?",
  "phase": "hr",
  "questionNumber": 1,
  "message": "Moving to HR round questions"
}
```

### Answer Response (Complete)
```json
{
  "complete": true,
  "message": "Interview completed successfully",
  "summary": {
    "totalQuestions": 18,
    "phases": {
      "intro": 5,
      "hr": 5,
      "technical": 8
    }
  }
}
```

---

## ✨ Success Checklist

- [ ] Test server starts on port 5001
- [ ] Start interview returns sessionId
- [ ] Can submit answers and get next questions
- [ ] Phases transition automatically (intro → HR → technical)
- [ ] Interview completes with summary
- [ ] HTML test page works in browser

---

## 🎯 Next Steps

Once basic flow works:
1. Integrate with frontend React components
2. Add database persistence for sessions
3. Add scoring/evaluation
4. Add timer per question
5. Generate interview report
6. Add AI-powered follow-ups

---

## 📞 Still Not Working?

Share the error message you're seeing:
- Server console output
- Browser console errors
- API response errors

I'll help debug!
