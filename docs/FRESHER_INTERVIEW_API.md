# Fresher Interview API

A structured interview flow for freshers with fixed and random questions across three phases: Introduction, HR, and Technical.

## Interview Flow

### Phase 1: Introduction (5 Fixed Questions)
1. "To begin with, could you introduce yourself and walk me through your background?"
2. "Can you tell me about a project or achievement that you're most proud of, and why?"
3. "Describe a time when you faced a difficult problem or challenge. How did you handle it?"
4. "What programming languages do you know/use regularly?"
5. "Have you used object-oriented design in a project?"

### Phase 2: HR Round (Random Questions)
After completing the 5 intro questions, the system picks random HR questions from a pool of 17 questions covering:
- Company fit and motivation
- Team collaboration
- Stress management
- Strengths and weaknesses
- Career goals
- Salary expectations
- Relocation willingness

### Phase 3: Technical Round
**Part A: 5 Fixed Core Questions**
1. "Can you explain the main OOP concepts (encapsulation, inheritance, polymorphism, abstraction) with a simple example?"
2. "What is the difference between an array and a linked list? When would you use each?"
3. "What is the difference between a stack and a queue? Can you give a real life example of each?"
4. "What are the different types of loops in your preferred programming language, and when do you use them?"
5. "Can you write or dry run a simple program to reverse a string or check if a number is a palindrome?"

**Part B: Random Technical Questions (Minimum Requirements)**
- **1 DSA question** (from 8 DSA problems)
- **2 OOP questions** (from Java/Python OOP concepts)
- Additional random questions from DBMS, Java, Python pools

## API Endpoints

### 1. Start Interview
**POST** `/api/fresher-interview/start`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "interviewerName": "John Smith",
  "role": "Senior HR Manager",
  "company": "TechCorp",
  "roundName": "Technical + HR Round"
}
```

**Response:**
```json
{
  "sessionId": "user123-1234567890",
  "greeting": "Good afternoon, my name is \"John Smith\", I work as an \"Senior HR Manager\", and I'll be conducting your \"Technical + HR Round\" discussion today...",
  "firstQuestion": "To begin with, could you introduce yourself and walk me through your background?",
  "phase": "intro",
  "questionNumber": 1,
  "totalQuestions": 5
}
```

### 2. Submit Answer
**POST** `/api/fresher-interview/answer`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sessionId": "user123-1234567890",
  "answer": "My answer to the question..."
}
```

**Response (Next Question):**
```json
{
  "nextQuestion": "Can you tell me about a project...",
  "phase": "intro",
  "questionNumber": 2,
  "totalQuestions": 5
}
```

**Response (Phase Transition):**
```json
{
  "nextQuestion": "What attracted you to this role...",
  "phase": "hr",
  "questionNumber": 1,
  "message": "Moving to HR round questions"
}
```

**Response (Interview Complete):**
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

### 3. Get Session Info
**GET** `/api/fresher-interview/session/:sessionId`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "session": {
    "phase": "technical",
    "currentQuestionIndex": 3,
    "totalResponses": 13,
    "startedAt": "2024-01-15T10:30:00.000Z",
    "completedAt": null
  }
}
```

## Question Categories

### HR Questions (17 total)
- Company and role fit
- Teamwork and collaboration
- Stress management
- Strengths and weaknesses
- Career goals and motivation
- Compensation and logistics

### Technical Questions
**Core (5 fixed):** OOP, Data Structures, Algorithms basics

**DBMS/OS (11):** Database concepts, processes, threads, SDLC, HTTP, ACID, SQL optimization

**Java (13):** JVM, OOP in Java, access modifiers, inheritance, interfaces

**Python (9):** Python basics, data types, OOP in Python

**DSA (8):** String manipulation, Fibonacci, palindrome, factorial, prime numbers, array operations

## Implementation Notes

1. **Session Management:** Uses in-memory storage (Map). For production, use Redis or database.

2. **Question Selection:**
   - Fixed questions are served in order
   - Random questions avoid repetition within the same session
   - Technical random phase ensures minimum 1 DSA + 2 OOP questions

3. **Phase Transitions:**
   - Intro → HR: After 5 fixed intro questions
   - HR → Technical: After random HR questions
   - Technical Fixed → Technical Random: After 5 fixed technical questions
   - Complete: After 1 DSA + 2 OOP + any additional random technical

4. **Authentication:** All endpoints require valid JWT token

## Testing

Run the test script:
```bash
TEST_TOKEN=your_jwt_token node backend/test-fresher-interview.js
```

## Future Enhancements

- [ ] Persist sessions to database
- [ ] Add AI-powered follow-up questions based on answers
- [ ] Generate interview report with scores
- [ ] Add time tracking per question
- [ ] Support resume/pause functionality
- [ ] Add video/audio recording
- [ ] Generate improvement suggestions
