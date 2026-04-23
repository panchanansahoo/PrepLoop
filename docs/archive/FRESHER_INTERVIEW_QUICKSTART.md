# Fresher Interview - Quick Start Guide

## Option 1: Test with Standalone Server (Easiest)

1. **Start the test server** (no authentication required):
   ```bash
   cd backend
   node test-fresher-server.js
   ```

2. **Open the test page** in your browser:
   ```
   Open: test-fresher-interview.html
   ```
   - Change API URL to: `http://localhost:5001`
   - Leave token field empty
   - Click "Start Interview"

3. **Or use curl**:
   ```bash
   # Start interview
   curl -X POST http://localhost:5001/api/fresher-interview/start ^
     -H "Content-Type: application/json" ^
     -d "{\"interviewerName\":\"John\",\"role\":\"HR\",\"company\":\"TechCorp\",\"roundName\":\"Technical\"}"

   # Submit answer (replace SESSION_ID with actual session ID from start response)
   curl -X POST http://localhost:5001/api/fresher-interview/answer ^
     -H "Content-Type: application/json" ^
     -d "{\"sessionId\":\"SESSION_ID\",\"answer\":\"My answer here\"}"
   ```

## Option 2: Test with Main Backend

1. **Start the main backend**:
   ```bash
   npm run dev
   ```

2. **Get an auth token**:
   - Login or register a user
   - Copy the JWT token from the response

3. **Use the test page**:
   - Open: `test-fresher-interview.html`
   - API URL: `http://localhost:5000`
   - Paste your token in the token field
   - Click "Start Interview"

## Option 3: Use Postman/Thunder Client

### 1. Start Interview
**POST** `http://localhost:5000/api/fresher-interview/start`

Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

Body:
```json
{
  "interviewerName": "John Smith",
  "role": "Senior HR Manager",
  "company": "TechCorp",
  "roundName": "Technical + HR Round"
}
```

### 2. Submit Answer
**POST** `http://localhost:5000/api/fresher-interview/answer`

Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN_HERE
```

Body:
```json
{
  "sessionId": "YOUR_SESSION_ID_FROM_START",
  "answer": "My detailed answer to the question..."
}
```

### 3. Get Session Info
**GET** `http://localhost:5000/api/fresher-interview/session/YOUR_SESSION_ID`

Headers:
```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Expected Flow

1. **Start** → Get greeting + first intro question
2. **Answer 5 times** → Complete intro phase
3. **Answer 5 times** → Complete HR phase (random questions)
4. **Answer 5 times** → Complete fixed technical phase
5. **Answer 3 times** → Complete random technical (1 DSA + 2 OOP)
6. **Complete** → Get summary

## Troubleshooting

### "Session not found"
- Make sure you're using the correct sessionId from the start response
- Sessions are stored in memory, so restarting the server clears them

### "Unauthorized" / 403 error
- You need a valid JWT token
- Use the standalone test server (port 5001) which doesn't require auth

### "Cannot POST /api/fresher-interview/start"
- Make sure the backend server is running
- Check the route is registered in `backend/index.js`

### Port already in use
- Main backend uses port 5000
- Test server uses port 5001
- Change ports if needed

## Files Created

- `backend/routes/fresher-interview.js` - Main route implementation
- `backend/test-fresher-server.js` - Standalone test server
- `test-fresher-interview.html` - Browser-based test UI
- `docs/FRESHER_INTERVIEW_API.md` - Full API documentation
