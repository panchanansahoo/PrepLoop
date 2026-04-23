# AI Job Copilot - Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────────────┐         ┌──────────────────────┐         │
│  │  AIJobCopilotWidget  │────────▶│   AIJobCopilot Page  │         │
│  │   (Dashboard)        │         │   (/copilot)         │         │
│  └──────────────────────┘         └──────────────────────┘         │
│           │                                  │                       │
│           │ Navigate with                    │                       │
│           │ initial query                    │                       │
│           └──────────────────────────────────┘                       │
│                                  │                                   │
│                                  │                                   │
│                    ┌─────────────▼─────────────┐                    │
│                    │   AI Chat Section         │                    │
│                    │   - Query input           │                    │
│                    │   - Ask button            │                    │
│                    │   - AI response display   │                    │
│                    └─────────────┬─────────────┘                    │
│                                  │                                   │
│                    ┌─────────────▼─────────────┐                    │
│                    │ Resume Analysis Section   │                    │
│                    │ - File upload             │                    │
│                    │ - Target role             │                    │
│                    │ - Job description         │                    │
│                    │ - ATS score display       │                    │
│                    └───────────────────────────┘                    │
│                                                                       │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                │ HTTP Requests
                                │ (with JWT Auth)
                                │
┌───────────────────────────────▼───────────────────────────────────┐
│                         BACKEND (Express)                          │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    API Routes                                 │ │
│  ├──────────────────────────────────────────────────────────────┤ │
│  │                                                               │ │
│  │  POST /api/copilot/ask                                       │ │
│  │  ├─ Validates query (min 3 chars)                           │ │
│  │  ├─ Checks authentication                                    │ │
│  │  ├─ Calls Groq AI with career coaching prompt              │ │
│  │  └─ Returns AI-generated advice                             │ │
│  │                                                               │ │
│  │  POST /api/copilot/job-fit                                   │ │
│  │  ├─ Validates job title & description                       │ │
│  │  ├─ Checks authentication                                    │ │
│  │  ├─ Analyzes candidate-job match                           │ │
│  │  └─ Returns fit analysis & recommendations                  │ │
│  │                                                               │ │
│  │  POST /api/resume/analyze (existing)                         │ │
│  │  ├─ Accepts PDF file upload                                 │ │
│  │  ├─ Extracts text from PDF                                  │ │
│  │  ├─ Calls Groq AI for ATS analysis                         │ │
│  │  └─ Returns ATS score & suggestions                         │ │
│  │                                                               │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                │                                    │
│                                │                                    │
│  ┌─────────────────────────────▼──────────────────────────────┐   │
│  │              Middleware Layer                               │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  - authenticateToken (JWT validation)                       │   │
│  │  - Rate limiting (15 min window)                            │   │
│  │  - Error handling                                            │   │
│  │  - Request logging                                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                │                                    │
│                                │                                    │
│  ┌─────────────────────────────▼──────────────────────────────┐   │
│  │              AI Service Layer                               │   │
│  ├─────────────────────────────────────────────────────────────┤   │
│  │  - aiCallWithRetry utility                                  │   │
│  │  - Timeout handling (15s)                                   │   │
│  │  - Retry logic (2 retries)                                  │   │
│  │  - Error recovery                                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  │ API Calls
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│                      EXTERNAL SERVICES                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    Groq AI API                              │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  Model: llama-3.3-70b-versatile                           │ │
│  │  Temperature: 0.7 (conversational)                         │ │
│  │  Max Tokens: 1024                                          │ │
│  │  Timeout: 15 seconds                                       │ │
│  │                                                             │ │
│  │  System Prompt:                                            │ │
│  │  - Expert career coach                                     │ │
│  │  - Interview strategist                                    │ │
│  │  - Tech industry specialist                                │ │
│  │  - STAR method expert                                      │ │
│  │  - Salary negotiation advisor                              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  Supabase (Database)                        │ │
│  ├────────────────────────────────────────────────────────────┤ │
│  │  - User authentication (JWT)                               │ │
│  │  - Resume analysis history                                 │ │
│  │  - User profiles                                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Ask Copilot Flow
```
User Input → Frontend Validation → API Request → Auth Check → 
Groq AI Call → AI Response → Format Response → Display to User
```

### 2. Job Fit Analysis Flow
```
Job Details + User Profile → API Request → Auth Check → 
Groq AI Analysis → Match Score + Gaps + Recommendations → 
Display Results
```

### 3. Resume Analysis Flow (Existing)
```
PDF Upload → Extract Text → API Request → Auth Check → 
Groq AI Analysis → ATS Score + Suggestions → 
Save to Database → Display Results
```

## Key Components

### Frontend Components
- `AIJobCopilotWidget.jsx` - Dashboard widget for quick access
- `AIJobCopilot.jsx` - Main copilot page with chat and analysis
- `AIJobCopilot.css` - Styling for copilot interface

### Backend Routes
- `routes/copilot.js` - New conversational AI endpoints
- `routes/resume.js` - Existing resume analysis endpoints

### Utilities
- `utils/aiClient.js` - AI call wrapper with retry logic
- `middleware/auth.js` - JWT authentication
- `utils/structuredLogger.js` - Request logging

### Configuration
- `GROQ_API_KEY` - Required for AI functionality
- `JWT_SECRET` - Required for authentication
- Rate limits: 250 requests/15min (global), 30 requests/15min (auth)

## Security Layers

1. **Authentication**: JWT token required for all endpoints
2. **Rate Limiting**: Prevents abuse and API quota exhaustion
3. **Input Validation**: Minimum query length, required fields
4. **Error Handling**: No sensitive data in error messages
5. **CORS**: Configured origins only
6. **Timeout Protection**: 15-second max for AI calls

## Performance Considerations

- **Caching**: Consider adding Redis for frequent queries
- **Async Processing**: AI calls are non-blocking
- **Retry Logic**: Automatic retry on transient failures
- **Timeout**: Prevents hanging requests
- **Response Streaming**: Could be added for real-time responses

## Scalability

- **Horizontal Scaling**: Stateless design allows multiple instances
- **Load Balancing**: Can distribute across multiple servers
- **API Quota**: Monitor Groq API usage and limits
- **Database**: Supabase handles scaling automatically
- **CDN**: Frontend assets can be cached globally

## Monitoring Points

- API response times (target: < 15s)
- Error rates (target: < 1%)
- Authentication failures
- Rate limit hits
- Groq API quota usage
- User engagement metrics
